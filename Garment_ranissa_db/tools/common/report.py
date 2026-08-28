"""
============================================================
Ranissa Tooling SDK
Report Utilities
============================================================
"""

from dataclasses import dataclass, field

from common.printer import (
    line,
    info,
    ok,
    warn,
    fail,
)


# ============================================================
# RESULT
# ============================================================

@dataclass
class CheckResult:

    name: str

    passed: bool

    message: str = ""


# ============================================================
# REPORT
# ============================================================

@dataclass
class Report:

    title: str

    checks: list[CheckResult] = field(default_factory=list)


# ============================================================
# REPORT API
# ============================================================

class Reporter:

    def __init__(self, title):

        self.report = Report(title)

    # --------------------------------------------------------

    def pass_check(self, name, message=""):

        self.report.checks.append(

            CheckResult(
                name=name,
                passed=True,
                message=message,
            )

        )

    # --------------------------------------------------------

    def fail_check(self, name, message=""):

        self.report.checks.append(

            CheckResult(
                name=name,
                passed=False,
                message=message,
            )

        )

    # --------------------------------------------------------

    def warning(self, message):

        warn(message)

    # --------------------------------------------------------

    def summary(self):

        passed = sum(
            1 for c in self.report.checks if c.passed
        )

        failed = len(self.report.checks) - passed

        line()

        info(self.report.title.upper())

        line()

        for check in self.report.checks:

            if check.passed:

                ok(check.name)

            else:

                fail(check.name)

            if check.message:

                print(f"      {check.message}")

        line()

        info(f"Passed : {passed}")

        info(f"Failed : {failed}")

        info(f"Total  : {len(self.report.checks)}")

        line()

        return failed == 0
